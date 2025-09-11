<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M9 18V5l12-2v13" }], ["circle", { "cx": "6", "cy": "18", "r": "3" }], ["circle", { "cx": "18", "cy": "16", "r": "3" }]];
</script>

<Icon name="music" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
